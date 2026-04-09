#!/usr/bin/env node
// PreToolUse hook: warns before Claude edits any file under data/feather/
// This data is hand-researched in-game and hard to re-verify — treat it as ground truth.
// Exit 0 = allow, Exit 2 = block with message

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
    try {
        const toolInput = JSON.parse(input);
        const filePath = toolInput.file_path || toolInput.path || '';

        if (filePath.replace(/\\/g, '/').includes('data/feather')) {
            process.stderr.write(
                `[CSV Data Guard] You are editing confirmed game data: ${filePath}\n` +
                `This data was hand-researched in-game. Only modify if you have verified in-game values.\n` +
                `If adding new tier data, ensure column order matches the file's header row exactly.\n`
            );
            // Exit 0 = warn but allow. Change to exit 2 to block outright.
            process.exit(0);
        }
    } catch (_) {
        // If we can't parse input, don't block
    }
    process.exit(0);
});
