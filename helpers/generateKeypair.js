/**
 * This module will generate a public and private keypair and save to root project directory
 * 
 * Make sure to save the private key elsewhere after generated!
 */
 const crypto = require('crypto');
 const fs = require('fs');
 
 function genAccessKeyPair() {
    let keypair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096, // bits - standard for RSA keys
        publicKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1" 
            format: 'pem' // Most common formatting choice
        },
        privateKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1"
            format: 'pem' // Most common formatting choice
        }
    });

    const ACCESS_TOKEN_PUBLIC_KEY = keypair.publicKey
    const ACCESS_TOKEN_PRIVATE_KEY = keypair.privateKey

     // Create the public key file for access token
     fs.writeFileSync(__dirname + '/../' + 'access_rsa_public.pem', ACCESS_TOKEN_PUBLIC_KEY); 
     // Create the private key file for access token
     fs.writeFileSync(__dirname + '/../' + 'access_rsa_private.pem', ACCESS_TOKEN_PRIVATE_KEY);
 }

 function genRefreshKeyPair() {
    let keypair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096, // bits - standard for RSA keys
        publicKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1" 
            format: 'pem' // Most common formatting choice
        },
        privateKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1"
            format: 'pem' // Most common formatting choice
        }
    });

    const REFRESH_TOKEN_PUBLIC_KEY = keypair.publicKey
    const REFRESH_TOKEN_PRIVATE_KEY = keypair.privateKey

     // Create the public key file for refresh token
     fs.writeFileSync(__dirname + '/../' + 'refresh_rsa_public.pem', REFRESH_TOKEN_PUBLIC_KEY); 
     // Create the private key file for refresh token
     fs.writeFileSync(__dirname + '/../' + 'refresh_rsa_private.pem', REFRESH_TOKEN_PRIVATE_KEY);
 
 }

 // Generate the keypairs
 genAccessKeyPair();
 genRefreshKeyPair();