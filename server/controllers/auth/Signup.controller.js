const Signup = (req,res)=>{
    console.log("singup controller called");

    return res.send({
        "status" : 200,
        "message" : "signup success"

    });
}

export default Signup;