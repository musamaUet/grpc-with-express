const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const app = express();

const packageDefinitionUsers = protoLoader.loadSync(path.join(__dirname,'../protos/users.proto'));
const packageDefinitionProducts = protoLoader.loadSync(path.join(__dirname,'../protos/products.proto'));

const usersProto = grpcLibrary.loadPackageDefinition(packageDefinitionUsers);
const productsProto = grpcLibrary.loadPackageDefinition(packageDefinitionProducts);

const usersStub = new usersProto.Users('0.0.0.0:50000', grpcLibrary.credentials.createInsecure());
const productsStub = new productsProto.Products('0.0.0.0', grpcLibrary.credentials.createInsecure());

app.use(express.json());

const RESTPORT = 5000;

function processAsync(){}


app.get('/',(req, res)=>{

});

app.listen(RESTPORT, () => {
    console.log(`RESTful API is listening on port ${RESTPORT}`);
  });