#!/usr/bin/env node
import { checkbox, Separator } from '@inquirer/prompts';
import ora from 'ora';
import { exec } from 'child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

if (!fs.existsSync(path.join(process.cwd(), 'pom.xml'))) {
  console.error('❌  pom.xml file not found in the current directory');
  process.exit(1);
}

const routinesScripts = process.env.RUTINASSCRIPTS;
if (!routinesScripts) {
  console.error('❌  Environment variable RUTINASSCRIPTS is not set');
  process.exit(1);
}

const scripts = [
  { name: 'ASO Script', value: 'aso_6_arq_migration.sh' },
  { name: 'Utils Script', value: 'utils_rm_migration.sh' },
  { name: 'Validation Script', value: 'validation_rm_migration.sh' },
  { name: 'BioCatch Script', value: 'behavioral_biometrics_validator_migration.sh' },
  new Separator(),
  { name: 'Container Script', value: 'podman_container.sh' },
  { name: 'Sonar Script', value: 'sonar_scan.sh' },
];

export async function runner() {
  const answer = await checkbox({
    name: 'selectedScripts',
    message: 'Select scripts in order to run',
    choices: scripts,
    loop: false,
  });

  if (answer.length === 0) {
    console.log('❌  No scripts selected');
    return;
  }

  for (const script of answer) {
    console.log(`Running script: ${script}`);

    const scriptPath = path.join(routinesScripts, script);
    const spinner = ora({
      text: `Running ${script}...`,
      indent: 2,
    }).start();

    try {
      await new Promise((resolve, reject) => {
        const child = exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
          if (error) {
            return reject(error);
          } else {
            // console.log(stdout);
            // console.log(stderr);
            resolve();
          }
        });

        child.stdout.on('data', (data) => {
          process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });

      spinner.succeed(`Successfully ran ${script}`);
    } catch (error) {
      spinner.fail(`Failed to run ${script}: ${error.message}`);
    }
  }
}
