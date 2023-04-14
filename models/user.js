const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userschema =  new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    email:{
        type:String,
        trim:true,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        required:true,
        default:false
    }
     

},
)

userschema.methods.comparepassword = async function(password){
    const user= this
    const result  = await bcrypt.compare(password,user.password)
    return result
}

userschema.pre("save", async function(next){
    const user =this
    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password,10)
    }
    next()
})


const user = mongoose.model("User",userschema)

module.exports= user