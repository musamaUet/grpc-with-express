const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const app = express();

const packageDefinitionUsers = protoLoader.loadSync(path.join(__dirname,'./protos/users.proto'));
const packageDefinitionProducts = protoLoader.loadSync(path.join(__dirname,'./protos/products.proto'));

const usersProto = grpcLibrary.loadPackageDefinition(packageDefinitionUsers);
const productsProto = grpcLibrary.loadPackageDefinition(packageDefinitionProducts);

const usersStub = new usersProto.Users('0.0.0.0:50000', grpcLibrary.credentials.createInsecure());
const productsStub = new productsProto.Products('0.0.0.0:40000', grpcLibrary.credentials.createInsecure());

app.use(express.json());

const RESTPORT = 5000;

app.get('/users/:userId',async(req, res)=>{
  const {userId} = req.params;

   await usersStub.findUser({id:userId},(error, response)=>{
    console.log('response', response);
    res.status(200).json({user:response})
  });
});

app.get('/products/:productId',async(req, res)=>{
  const {productId} = req.params;

   await productsStub.findProduct({id:productId},(error, response)=>{
    console.log('response', response);
    res.status(200).json({product:response})
  });
});

app.listen(RESTPORT, () => {
    console.log(`RESTful API is listening on port ${RESTPORT}`);
  });