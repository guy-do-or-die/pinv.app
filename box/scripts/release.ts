
import { spawn } from "child_process";
import { readFileSync } from "fs";

// Helper to run commands
function run(cmd: string, args: string[], cwd: string = process.cwd(), env: Record<string, string> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`> ${cmd} ${args.join(" ")}`);

        // Ensure Bun is in PATH
        const BUN_BIN = process.env.HOME + "/.bun/bin";
        const PATH = BUN_BIN + ":" + (process.env.PATH || "");

        const proc = spawn(cmd, args, {
            stdio: "inherit",
            cwd,
            env: { ...process.env, ...env, PATH }
        });
        proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}

// Helper to capture output
function runCapture(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        proc.stdout.on("data", d => stdout += d.toString());
        proc.on("close", (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}

async function main() {
    try {
        const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
        const imageName = pkg.config?.image_name;
        if (!imageName) throw new Error("config.image_name missing in package.json");

        const BUN = process.env.HOME + "/.bun/bin/bun";

        console.log("🚀 Starting Atomic Release Workflow...");

        // 1. Ensure Git is Clean
        try {
            await run("git", ["diff", "--quiet"]);
            await run("git", ["diff", "--cached", "--quiet"]);
        } catch (e) {
            throw new Error("Git working directory is not clean. Commit changes before releasing.");
        }

        // 2. Build Candidate (tagged as latest temporarily)
        console.log("\n📦 Building Candidate Image...");
        await run(BUN, ["run", "docker:build"]);

        // 3. Test Candidate
        console.log("\n🧪 verifying Candidate...");
        await run(BUN, ["run", "docker:run"]);

        console.log("   (Waiting for container to init...)");
        await new Promise(r => setTimeout(r, 5000));

        try {
            await run(BUN, ["run", "docker:test"]);
        } catch (e) {
            console.error("\n❌ Verification FAILED. Aborting release.");
            console.error("   (Version has NOT been bumped.)");
            process.exit(1);
        }

        // 4. Bump Version
        console.log("\n✅ Verification Passed. Bumping Version...");

        const currentVersion = pkg.version;
        const [major, minor, patch] = currentVersion.split(".").map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;

        pkg.version = newVersion;
        // writes result to package.json
        await run("bun", ["run", "node", "-e", `const fs = require('fs'); const pkg = ${JSON.stringify(pkg, null, 2)}; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\\n');`]);

        console.log(`   New Version: ${newVersion}`);

        // Commit and Tag
        await run("git", ["add", "package.json"]);
        await run("git", ["commit", "-m", `chore(release): v${newVersion}`]);
        await run("git", ["tag", `v${newVersion}`]);

        // 5. Retag Image
        console.log("\n🏷️  Tagging Image...");
        await run("docker", ["tag", `${imageName}:latest`, `${imageName}:${newVersion}`]);

        // 6. Push
        console.log("\n⬆️  Pushing Images...");
        await run("docker", ["push", `${imageName}:latest`]);
        await run("docker", ["push", `${imageName}:${newVersion}`]);

        // 7. Push Git Tags
        console.log("\nCOMMIT  Pushing Git...");
        await run("git", ["push", "--follow-tags", "origin", "develop"]);

        // 8. Deploy
        console.log("\n🚀 Deploying to Phala Cloud...");
        await run("npx", ["phala", "deploy", "-c", "docker-compose.yml"]);

        console.log("\n✨ Release Complete!");

    } catch (e: any) {
        console.error("\n💥 Release Failed:", e.message);
        process.exit(1);
    }
}

main();
