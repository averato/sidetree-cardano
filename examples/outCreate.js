"use strict";
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// examples/create.js
var import_did_tools = require("@averato/did-tools");
(() => __async(exports, null, function* () {
  const request = require("request");
  const util = require("util");
  const requestPromise = util.promisify(request);
  const nodeURL = "http://localhost:3000";
  const updateKey = yield generateKeyPair();
  console.log("Your update key:");
  console.log(updateKey);
  const recoveryKey = yield generateKeyPair();
  console.log("Your recovery key:");
  console.log(recoveryKey);
  const authnKeys = yield generateKeyPair("secp256k1");
  console.log("Your DID authentication key:");
  console.log(authnKeys);
  const didDocument = {
    publicKeys: [
      {
        id: "key-02",
        type: "EcdsaSecp256k1VerificationKey2019",
        publicKeyJwk: authnKeys.publicJwk,
        purposes: ["authentication"]
      }
    ],
    services: [
      {
        id: "domain-02",
        type: "LinkedDomains",
        serviceEndpoint: "https://test.example.com"
      }
    ]
  };
  console.log("Your DID document: ");
  console.log(didDocument);
  const createRequest = import_did_tools.DidRequest.createCreateRequest({
    recoveryKey: recoveryKey.publicJwk,
    updateKey: updateKey.publicJwk,
    document: didDocument
  });
  console.log("POST operation: " + JSON.stringify(createRequest));
  const resp = yield requestPromise({
    url: nodeURL + "/operations",
    method: "POST",
    body: JSON.stringify(createRequest)
  });
  const respBody = JSON.parse(resp.body);
  console.log(JSON.stringify(respBody));
  console.log("Your generated DID: " + JSON.stringify(respBody));
  function generateKeyPair(type = "") {
    return __async(this, null, function* () {
      let keyGeneratorFn = import_did_tools.DidKey.generateEs256kOperationKeyPair;
      if (type === "Ed25519") {
        keyGeneratorFn = import_did_tools.DidKey.generateEd25519OperationKeyPair;
      }
      ;
      const [publicKeyJwk, privateKeyJwk] = yield keyGeneratorFn(
        //  secureRandom: () => randomBytes(32)
      );
      return {
        publicJwk: publicKeyJwk,
        privateJwk: privateKeyJwk
      };
    });
  }
}))();
