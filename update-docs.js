#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function getFiles(base) {
    const directory = fs.readdirSync(base, { withFileTypes: true });
    const files = directory.map((dir) => {
        const res = path.resolve(base, dir.name);
        return dir.isDirectory() ? getFiles(res) : res;
    });
    return Array.prototype.concat(...files).filter((file) => file.indexOf(".ts") > 0);
}

const tests = getFiles("./test/programs");

let source = "# typescript-json-schema test examples\n\n";
tests.forEach((file) => {
    const contents = fs.readFileSync(file, "utf8");
    const folder = file.split("/").slice(-2)[0];
    source += `## [${folder}](./test/programs/${folder})\n\n\`\`\`ts\n${contents}\`\`\`\n\n\n`;
});

fs.writeFileSync("./api.md", source);
