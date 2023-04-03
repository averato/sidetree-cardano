// import DID from './did';
// import generateKeyPair from './utils.js'; 
import {DidRequest, DidKey} from '@averato/did-tools';

/**  Example on how to create a DID */
(async () => {
//  const DidTools = require('@averato/did-tools');
//  const randomBytes = require('randombytes');
//  const ed25519 = require('@transmute/did-key-ed25519');
//  const secp256k1 = require('@transmute/did-key-secp256k1');
  const request = require('request');
  const util = require('util');
  const requestPromise = util.promisify(request);

  const nodeURL = 'http://localhost:3000';
  // const nodeURL = 'https://testnet.sidetree-cardano.com/cardano';

  // Generate update and recovery keys for sidetree protocol
  // Should be stored somewhere, you'll need later for updates and recovery of your DID
  const updateKey = await generateKeyPair(); // also supports Ed25519
  console.log('Your update key:');
  console.log(updateKey);
  const recoveryKey = await generateKeyPair(); // also supports Ed25519
  console.log('Your recovery key:');
  console.log(recoveryKey);

  // Generate authentication key for the W3C DID Document
  // Should be stored somewhere, you'll need it later for your proofs
  const authnKeys = await generateKeyPair('secp256k1'); // also supports Ed25519
  console.log('Your DID authentication key:');
  console.log(authnKeys);

  // Create you rW3C DID document
  const didDocument = {
    publicKeys: [
      {
        id: 'key-02',
        type: 'EcdsaSecp256k1VerificationKey2019',
        publicKeyJwk: authnKeys.publicJwk,
        purposes: ['authentication']
      }
    ],
    services: [
      {
        id: 'domain-02',
        type: 'LinkedDomains',
        serviceEndpoint: 'https://test.example.com'
      }
    ]
  };
  console.log('Your DID document: ');
  console.log(didDocument);

  // Create the request body ready to be posted in /operations of Sidetree API
  const createRequest = DidRequest.createCreateRequest({
    recoveryKey: recoveryKey.publicJwk,
    updateKey: updateKey.publicJwk,
    document: didDocument
  });
  console.log('POST operation: ' + JSON.stringify(createRequest));

  // POST request body to Sidetree-Cardano node API
  const resp = await requestPromise({
    url: nodeURL + '/operations',
    method: 'POST',
    body: JSON.stringify(createRequest)
  });
  const respBody = JSON.parse(resp.body);
  console.log(JSON.stringify(respBody));
  console.log('Your generated DID: ' + JSON.stringify(respBody));

  // Helper function to generate keys
  // You can use your prefered key generator
  // type: secp256k1 | Ed25519
  async function generateKeyPair (type = '') {
    let keyGeneratorFn = DidKey.generateEs256kOperationKeyPair;
    if (type === 'Ed25519') { keyGeneratorFn = DidKey.generateEd25519OperationKeyPair; };
    const [publicKeyJwk, privateKeyJwk] = await keyGeneratorFn(
    //  secureRandom: () => randomBytes(32)
    );
    // const { publicKeyJwk, privateKeyJwk } = await keyPair.toJsonWebKeyPair(true);
    return {
      publicJwk: publicKeyJwk,
      privateJwk: privateKeyJwk
    };
  }
})();
