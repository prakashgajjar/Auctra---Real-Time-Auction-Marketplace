const Login = (req,res)=>{
    console.log("login controller called");

    return res.send({
        "status" : 200,
        "message" : "login success"
    });
}

export default Login;

