const path = require('path');
const grpcLibrary = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(path.join(__dirname,'../protos/users.proto'));

const usersProto = grpcLibrary.loadPackageDefinition(packageDefinition);

const USERS = [
    {
        id: 1,
        name: 'Ali',
    },
    {
        id: 2,
        name: 'Asdf',
    }
];

function createUser(call, callback) {
    const user = {id:USERS.length+1,name:call.request.name}
    USERS.push(user);

    console.log('user',user)
    return callback(null,  user);
}

function findUser(call, callback){

    const user = USERS.find(user => user.id === call.request.id);
    if(!user){
        callback(null, { success: false, status:grpcLibrary.status.INVALID_ARGUMENT});
    } else{
        console.log('user',user)
        callback(null,user)
    }
}

const server = new grpcLibrary.Server();

server.addService(usersProto.Users.service, {
    createUser:createUser,
    findUser:findUser
});

server.bindAsync('127.0.0.1:50000',grpcLibrary.ServerCredentials.createInsecure(),()=>{
   console.log('user proto started')
    server.start()
});