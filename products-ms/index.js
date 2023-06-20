const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const ProtoBuf = require('protobufjs');

 const root = ProtoBuf.loadSync(path.join(__dirname,'../protos/products.proto'));
 const Product = root.lookupType('Product');
 const Any = root.lookupType('google.protobuf.Any'); 

const packageDefinition = protoLoader.loadSync(path.join(__dirname,'../protos/products.proto'));

const productProto = grpcLibrary.loadPackageDefinition(packageDefinition);

const PRODUCTS = [
    {
        id: 101,
        userId: 1,
        productName: 'Pizza',
        userInfo:{
            '@type': 'google.protobuf.Any',
            value:{
                id:1,
                name:'Ali',
            }
        },
    },
    {
        id: 102,
        userId: 2,
        productName: 'Lasagna',
        userInfo:{
            '@type': 'google.protobuf.Any',
            value:{
            id:2,
            name:'ASDF',
            }
        }
    }
];

function serializeProduct(productData) {
    console.log('productData', productData)
    const { userInfo, ...rest } = productData;
  try{

    const userInfoSerialized = Any.encode(userInfo).finish(); // Replace 'YourMessage' with the actual message type of userInfo
    const userInfoAny = Any.create({
        type_url: 'google.protobuf.Any', // Replace 'YourMessage' with the actual type URL of your message
        value: userInfoSerialized, // Replace 'YourMessage' with the actual message type
      });
    
      console.log('useInfoAny', userInfoAny)
  
      const message = Product.create({ ...rest, userInfo: userInfoAny });
      console.log('message', message)
    //   const buffer = Product.encode(message).finish();
    //   console.log('buffer', buffer)
      return message;
  }catch(err){
    console.log('err', err)
  }

  }


function createProduct(call, callback){
    const product = { id: PRODUCTS.length + 1, ...call.request };
    PRODUCTS.push(product);
    

    return callback(null,  product);
}

function findProduct(call, callback){
    console.log('called');
    let product = PRODUCTS.find(product => product.id === call.request.id);
    if(!product){
        callback(null, { success: false, status: grpcLibrary.status.INVALID_ARGUMENT });
    } else{
product = serializeProduct(product);
console.log('product', product)
// product = deserializeProduct(product);
// console.log('product-D', deserializeProduct(product))

        return callback(null, product);
    }
}

const server = new grpcLibrary.Server();
server.addService(productProto.Products.service,{
    createProduct: createProduct,
    findProduct: findProduct
});
server.bindAsync('127.0.0.1:40000',grpcLibrary.ServerCredentials.createInsecure(),()=>{
    console.log('grpc server called!');
    server.start();
});
