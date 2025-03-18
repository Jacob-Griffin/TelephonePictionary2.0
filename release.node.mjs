import { processArgs } from './script-utils.node.mjs';
import { execSync } from 'child_process';
import { exit } from 'process';
const automationAccount = 'griffin-automation';

const args = processArgs(process.argv, [], ['v']);
const version = args.get('v');
console.log(`Releasing version ${version}`);
const ghAccounts = execSync('gh auth status').toString();
const currentAuth = ghAccounts.match(/account (\S+).*\n.+Active account: true/)?.[1];
const currentUserName = execSync('git config get user.name').toString();
if (currentAuth !== automationAccount) {
  if (!ghAccounts.includes(automationAccount)) {
    console.error('Automation account not found, cancelling');
    exit(1);
  }
  execSync(`gh auth switch -u ${automationAccount}`);
  execSync(`git config set user.name ${automationAccount}`);
}

const _branch = execSync('git branch').toString();
const branch = _branch.match(/\* (.+)/)[1];
if (branch !== 'dev') {
  console.log('switching to branch dev');
  execSync(`git switch dev`);
}

execSync('git fetch');
execSync('git pull');

console.log('Creating pr branch for new release');
execSync(`git branch version-${version}`);
execSync(`git switch version-${version}`);

const packages = execSync(
  'find packages/*/package.json apps/*/package.json ./package.json -iname package.json',
)
  .toString()
  .trim()
  .split('\n');

packages.forEach(p => {
  const oldContent = execSync(`cat ${p}`).toString();
  const newContent = oldContent.replace(/"version": ".*"/, `"version": "${version}"`);
  execSync(`echo -n "${newContent.replaceAll('\\"', '\\\\"').replaceAll('"', '\\"')}" | cat > ${p}`);
});

packages.forEach(p => execSync(`git add ${p}`));

console.log('Assembling changelog');
const changeItems = execSync('ls ./changes').toString().split('\n');
const changeContents = [];
changeItems.forEach(filename => {
  if (filename.startsWith('[') || filename === 'example.md') {
    return;
  }
  if (!filename.endsWith('.md')) {
    return;
  }
  const contents = execSync(`cat ./changes/${filename}`).toString();
  changeContents.push(contents);
  execSync(`mv ./changes/${filename} ./changes/[${version}]-${filename}`);
  execSync(`git add ./changes/[${version}]-${filename}`);
});

try {
  execSync(`git commit -m "Automated: Release ${version}"`);
} catch (e) {
  console.log(e.output.toString());
  exit(1);
}
execSync(`git push --set-upstream origin version-${version}`);

const devpr = execSync(
  `gh pr create -t "Release ${version}" -b "Automated release PR for version ${version}" -B "dev" -H "version-${version}"`,
).toString();
const devid = devpr.match(/\/pull\/(\d+)/)[1];
console.log(`Created PR #${devid} for version-${version} => dev`);

execSync(`gh pr merge ${devid} --squash -d`);
console.log(`Merged PR #${devid}. 'dev' is updated`);

const releasepr = execSync(
  `gh pr create -t "Release ${version}" -b "Automated release PR for version ${version}" -B "release" -H "dev"`,
).toString();
const releaseid = releasepr.match(/\/pull\/(\d+)/)[1];
console.log(`Created PR #${releaseid} for version-${version} => release`);

execSync(`gh pr merge ${releaseid} --merge`);

console.log(`Merged PR #${releaseid}. 'release' is caught up with dev`);

console.log('Catching up to new origin');
execSync('git fetch');
execSync('git switch dev');
execSync('git pull');
execSync('git switch release');
execSync('git pull');

console.log(`switching back to branch ${branch}`);
execSync(`git switch ${branch}`);

console.log(`Labeling installed:beta issues as installed:release`);
const issuesText = execSync(`gh issue list --label "C - Beta"`).toString();
const issues = [...issuesText.matchAll(/^\d+/gm)].map(match => match[0]);
issues.forEach(id => {
  execSync(`gh issue edit ${id} --remove-label "C - Beta"`);
  execSync(`gh issue edit ${id} --add-label "C - Released"`);
  execSync(
    `gh issue comment ${id} --body "Installed fixes from beta branch released with version ${version}"`,
  );
});

console.log(`Creating Release post`);
const releaseMessage = `Released ${issues.length} fixed issues according to labels. Changes:
${changeContents.join('\n\n')}`;
execSync(`gh release create v${version} --title "Release ${version}" --notes "${releaseMessage}"`);

console.log(`returning cli and git user`);
execSync(`gh auth switch -u ${currentAuth}`);
execSync(`git config set user.name ${currentUserName}`);
