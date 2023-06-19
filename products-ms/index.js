const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(path.join(__dirname,'../protos/products.proto'));

const productProto = grpcLibrary.loadPackageDefinition(packageDefinition);

const PRODUCTS = [
    {
        id: 101,
        userId: 1,
        productName: 'Pizza',
    },
    {
        id: 102,
        userId: 2,
        productName: 'Lasagna',
    }
];

function createProduct(call, callback){
    const product = { id: PRODUCTS.length + 1, ...call.request };
    PRODUCTS.push(product);
    

    return callback(null,  product);
}

function findProduct(call, callback){
    console.log('called');
    const product = PRODUCTS.find(product => product.id === call.request.id);
    if(!product){
        callback(null, { success: false, status: grpcLibrary.status.INVALID_ARGUMENT });
    } else{
        console.log('product', product);
        return callback(null,  product);
    }
}

const server = new grpcLibrary.Server();
server.addService(productProto.Products.service,{
    createProduct: createProduct,
    findProduct: findProduct
});
server.bindAsync('0.0.0.0:40000',grpcLibrary.ServerCredentials.createInsecure(),()=>{
    console.log('grpc server called!');
    server.start();
});