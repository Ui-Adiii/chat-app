const response = (res,statusCode,message,data=null)=>{
    if(!res){
        console.error("Response obj is null");
        return;
    }
    const resObj = {
        status:statusCode<400 ?"success":"error",
        message,
        data
    }
    return res.status(statusCode).json(resObj);
}
export default response