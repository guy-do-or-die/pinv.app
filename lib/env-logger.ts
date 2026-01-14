export function logEnv(envObj: Record<string, any>, serviceName: string = "SERVICE") {
    const maskedEnv: Record<string, string> = {};
    const sensitiveKeys = ["KEY", "SECRET", "TOKEN", "JWT", "PASSWORD", "URL"];

    for (const [key, value] of Object.entries(envObj)) {
        if (!value) {
            maskedEnv[key] = "(undefined)";
            continue;
        }

        const isPublic = key.startsWith("NEXT_PUBLIC_");
        const isSensitive = sensitiveKeys.some(s => key.toUpperCase().includes(s));

        if (isSensitive && !isPublic) {
            const strVal = String(value);
            if (strVal.length >= 10) {
                maskedEnv[key] = `${strVal.substring(0, 6)}...${strVal.substring(strVal.length - 6)}`;
            } else {
                maskedEnv[key] = "***";
            }
        } else {
            maskedEnv[key] = String(value);
        }
    }

    console.log("========================================");
    console.log(`PINV ${serviceName.toUpperCase()} ENVIRONMENT`);
    console.table(maskedEnv);
    console.log("========================================");
}
