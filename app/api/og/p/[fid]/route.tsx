import { ImageResponse } from 'next/og';
import { blockchainService } from '@/lib/blockchain-service';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fid: string }> }
) {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 40,
                        color: 'white',
                        background: 'black',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        textAlign: 'center',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    Pin not found
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    }

    // FETCH REAL DATA for the preview (MVP: Hardcoded for guy-do-or-die demo)
    try {
        const res = await fetch('https://api.github.com/users/guy-do-or-die', {
            headers: { 'User-Agent': 'PinV' }
        });
        if (res.ok) {
            const githubUser = await res.json();
            pin.stats = {
                githubRepos: githubUser.public_repos,
                githubStars: 120, // Stars require iterating all repos, mocking for speed
                followerCount: githubUser.followers,
            };
            pin.handle = githubUser.login; // Use real handle too
            pin.tagline = githubUser.bio || pin.tagline; // Use real bio
        }
    } catch (e) {
        console.error('Failed to fetch GitHub data for OG image', e);
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1a1a1a',
                    backgroundImage: `linear-gradient(to bottom right, #1a1a1a, ${pin.accentColor}80)`,
                    color: 'white',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', fontSize: 32, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '4px' }}>
                        PinV
                    </div>
                    <div style={{ display: 'flex', fontSize: 80, fontWeight: 900, marginTop: 20 }}>
                        {pin.handle}
                    </div>
                </div>

                {/* Card */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '40px',
                        padding: '40px 80px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        width: '80%',
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 48, textAlign: 'center', marginBottom: 40 }}>
                        {pin.tagline}
                    </div>

                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.githubRepos || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Repos</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.githubStars || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Stars</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.followerCount || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Followers</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', fontSize: 24, opacity: 0.5 }}>
                    pinv.app
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 800,
            headers: {
                'Cache-Control': 'public, immutable, no-transform, max-age=300',
            },
        }
    );
}
