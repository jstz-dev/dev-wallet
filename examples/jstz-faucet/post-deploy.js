#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const path = require('path');

const ENV_FILE_PATH = path.resolve(__dirname, './.env');

// Function to read a value from the .env file
const getEnvVar = (varName) => {
  const envFile = fs.readFileSync(ENV_FILE_PATH, 'utf8');
  const match = envFile.match(new RegExp(`^${varName}=(.*)$`, 'm'));
  return match ? match[1].replace(/"/g, '') : null;
};

// Get the environment from the command line arguments
const env = process.argv[2];

if (!env) {
  console.error('Usage: node post-deploy.js <dev|staging|prod>');
  process.exit(1);
}

// Get the deployed contract address
const fullAddress = getEnvVar('NEXT_PUBLIC_DEX_BASE_URL');

if (!fullAddress) {
  console.error('Error: NEXT_PUBLIC_DEX_BASE_URL not found in .env file.');
  process.exit(1);
}

const yourAddress = fullAddress.split('://').pop();

console.log(`Topping up address: ${yourAddress}`);

try {
  if (env === 'dev') {
    console.log('Topping up for dev environment...');
    execSync(`jstz bridge deposit --from bootstrap1 --to ${yourAddress} --amount 10000 --network dev`, { stdio: 'inherit' });
  } else if (env === 'staging') {
    console.log('Topping up for staging environment...');
    const topUpUrl = getEnvVar('STAGING_TOP_UP_URL');
    if (!topUpUrl) {
      console.error('Error: STAGING_TOP_UP_URL not found in .env file.');
      process.exit(1);
    }
    const command = `curl -XPOST ${topUpUrl} -d '{"from":"bootstrap3","contract":"KT1GFiPkkTjd14oHe6MrBPiRh5djzRkVWcni","amount":5000,"entrypoint":"deposit","arg":"${yourAddress}"}' -H 'Content-Type: application/json'`;
    execSync(command, { stdio: 'inherit' });
  } else if (env === 'prod') {
    console.log('Topping up for prod environment...');
    const topUpUrl = getEnvVar('PROD_TOP_UP_URL');
    if (!topUpUrl) {
      console.error('Error: PROD_TOP_UP_URL not found in .env file.');
      process.exit(1);
    }
    const command = `curl -XPOST ${topUpUrl} -d '{"from":"bootstrap4","contract":"KT1GFiPkkTjd14oHe6MrBPiRh5djzRkVWcni","amount":5000,"entrypoint":"deposit","arg":"${yourAddress}"}' -H 'Content-Type: application/json'`;
    execSync(command, { stdio: 'inherit' });
  } else {
    console.error(`Invalid environment: ${env}. Please use dev, staging, or prod.`);
    process.exit(1);
  }
  console.log(`Top-up complete for ${env} environment.`);
} catch (error) {
  console.error(`Error during top-up for ${env} environment:`, error);
  process.exit(1);
}
