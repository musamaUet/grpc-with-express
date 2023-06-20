const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const consul = require('consul');
const ProtoBuf = require('protobufjs');

const resolvedPath = path.resolve('./protos/products.proto');
const root = ProtoBuf.loadSync(resolvedPath);


const Product = root.lookupType('Product');
const Any = root.lookupType('google.protobuf.Any'); 


const app = express();

const consulObj = new consul({ promisify: true, log: 'debug' });

const packageDefinitionUsers = protoLoader.loadSync(path.join(__dirname,'./protos/users.proto'));
const packageDefinitionProducts = protoLoader.loadSync(path.join(__dirname,'./protos/products.proto'));

const usersProto = grpcLibrary.loadPackageDefinition(packageDefinitionUsers);
const productsProto = grpcLibrary.loadPackageDefinition(packageDefinitionProducts);

const usersStub = new usersProto.Users('127.0.0.1:50000', grpcLibrary.credentials.createInsecure());
const productsStub = new productsProto.Products('127.0.0.1:40000', grpcLibrary.credentials.createInsecure());

function deserializeProduct(buffer) {
  
  const serializedUserInfo = buffer.userInfo.value;

  const userInfoType = root.lookupType(buffer.userInfo.type_url);
  const deserializedUserInfo = userInfoType.decode(serializedUserInfo);

  // console.log('deserializedUserInfo', deserializedUserInfo)

  const productData = {
    id: buffer.id,
    userId: buffer.userId,
    productName: buffer.productName,
    userInfo: deserializedUserInfo,
  };
  
  return productData;
}


app.use(express.json());

const RESTPORT = 6000;

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

    if (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.error('Error-1:', response);
    console.log('response', deserializeProduct(response) );
    res.status(200).json({product:deserializeProduct(response)})
  });
});


app.get('/services',async(req,res)=>{
  // console.log('services', consulObj)
  const  data  = await consulObj.agent.service.list();
  // console.log('data', data);
  // const services = Object.values(data);
  res.status(200).json(data);
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

    registerService(usersServiceName, '127.0.0.1', 50000);
    registerService(productsServiceName, '127.0.0.1', 40000);
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