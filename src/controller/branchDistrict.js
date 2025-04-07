const branchModel=require ("../models/branch_lists")
const districtModel=require ("../models/district_lists")


// const { BranchList, 
//     DistrictList}=require("../models")


// const { AssignedLoans, DueLoanData, ActiveOfficers, UserInformations, CustomerInteraction, Payment,DistrictList, BranchList } = require("../models");


// const getBranchDistrict= async(req, res)=>{
//     try{
//         const branchList= await BranchList.findAll(
//             include=[
//                 {
//                     model:DistrictList,
//                     as:"district",
//                     attributes:
//                         ["dis_Id", "district_name"]
                    
//                 }
//             ]
//         )
//         if(branchList){
//             return res.status(200).json({
//                 status:"Success",
//                 branchList
//             })
        
//         }else{
//             return res.status(200).json({
//                 status:"Error",
//                 message:"No data found"
//             })
//         }
//     }catch(error){
//         console.log("The error", error)
//         res.status(500).json({
//             status:"Error",
//             message:"Something went wrong"
//         })
//     }

// }


const getBranchDistrict= async(req, res)=>{
    try{
        const branchList= await branchModel.findAll(
        )

        const distrctList=await districtModel.findAll()
        if(branchList.length>0 & distrctList.length>0){
            return res.status(200).json({
                status:"Success",
                branchData:branchList,
                distrctData:distrctList
            })

        }else{
            return res.status(200).json({
                status:"Error",
                message:"No data found"
            })
        }
    }catch(error){
        console.log("The error", error)
        res.status(500).json({
            status:"Error",
            message:"Something went wrong"
        })
    }

}


module.exports={getBranchDistrict}