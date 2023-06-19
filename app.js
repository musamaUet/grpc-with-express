const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const consul = require('consul');

const app = express();

const consulObj = new consul({ promisify: true, log: 'debug' });

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


app.get('/services',async(req,res)=>{
  // console.log('services', consulObj)
  const  data  = await consulObj.agent.service.list();
  // console.log('data', data);
  const services = Object.values(data);
  res.status(200).json(services);
})


const registerService = async (serviceName, serviceAddress, servicePort) => {
  const service = {
    name: serviceName,
    address: serviceAddress,
    port: servicePort,
    check: {
      http: `http://${serviceAddress}:${servicePort}/health`,
      interval: '10s',
      timeout: '5s',
    },
  };

  try {
    await consulObj.agent.service.register(service);
    console.log(`Service '${serviceName}' registered with Consul`);
  } catch (error) {
    console.error(`Failed to register service '${serviceName}':`, error);
  }
};


app.listen(RESTPORT, () => {
    console.log(`RESTful API is listening on port ${RESTPORT}`);
    const usersServiceName = usersProto.Users.serviceName;
    const productsServiceName = productsProto.Products.serviceName;

    registerService(usersServiceName, 'localhost', RESTPORT);
    registerService(productsServiceName, 'localhost', RESTPORT);
  });

  process.on('SIGINT', () => {
    // server.close(() => {
    //   console.log('Server closed');
    //   // Deregister the service from Consul before exiting
    //   serviceRegistry.agent.service.deregister('user-service', () => {
    //     console.log('Service deregistered from Consul');
    //     process.exit(0);
    //   });
    // });
  });