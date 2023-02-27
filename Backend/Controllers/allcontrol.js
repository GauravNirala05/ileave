const User = require('../model/User')
const Leave = require('../model/Leave')

const alluser = async (req, res) => {
    const { id: userID } = req.params
    const user = await User.findOne({ _id: userID })
    if (user) {
        const designation = user.designation
        if (designation === 'faculty') {
            return res.json({ status: 'FAILED', msg: `You are a ${designation} and cant access any other user` })
        }
        if (designation === 'HOD') {
            const alluser = await User.find({ department: user.department, designation: 'faculty' })
            return res.json({ status: `SUCCESS`, hits: alluser.length, users: alluser })
        }
        if (designation === 'principal') {
            const alluser = await User.find({ designation: ['faculty', 'HOD'] })
            return res.json({ status: `SUCCESS`, hits: alluser.length, users: alluser })
        }
        return res.status(401).json({ status: 'FAILED', msg: `plz provide credentials` })

    } else {
        res.status(404).json({ status: 'FAILED', msg: `user with id ${userID} doesnt exists...` })
    }
}
const leaveStatus = async (req, res) => {
    const { id: userID } = req.params
    const { status: stat } = req.body
    console.log(stat);
    if (await User.exists({ _id: userID })) {
        if (stat) {
            const leave = await Leave.find({ employee_id: userID, status: stat, })
            return res.status(200).json({ status: 'SUCCESS', hits: leave.length, data: leave })
        }
        const leave = await Leave.find({ employee_id: userID })
        res.status(200).json({ status: 'SUCCESS', hits: leave.length, data: leave })
    } else {
        return res.status(404).json({ status: 'FAILED', msg: `No user with id ${userID}` })

    }

}
const getApprovals = async (req, res) => {
    const { id: userID } = req.params
    const user = await User.findById(userID)
    if (user) {
        if (user.designation === 'faculty') {
            const data1 = await Leave.find({
                'reference1.name': user.name,
                status: ['applied', 'rejected']
            }).select('employee_id employee_dep employee_name from_date to_date reference1 leave_type')
            const data2 = await Leave.find({
                'reference2.name': user.name,
                status: ['applied', 'rejected']
            }).select('employee_id employee_dep employee_name from_date to_date reference2 leave_type')
            const data3 = await Leave.find({
                'reference3.name': user.name,
                status: ['applied', 'rejected']
            }).select('employee_id employee_dep employee_name from_date to_date reference3 leave_type')
            const data4 = await Leave.find({
                'reference4.name': user.name,
                status: ['applied', 'rejected']
            }).select('employee_id employee_dep employee_name from_date to_date reference4 leave_type')

            res.status(200).json({
                status: 'SUCCESS',
                data: {
                    first: { hits: data1.length, data1: data1 },
                    second: { hits: data2.length, data2: data2 },
                    third: { hits: data3.length, data3: data3 },
                    forth: { hits: data4.length, data4: data4 }
                }
            })
        }
        if (user.designation === 'HOD') {

            const data = await Leave.find({
                employee_dep: user.department,
                'reference1.approved': true,
                'reference2.approved': true,
                'reference3.approved': true,
                'reference4.approved': true,
                status: ['applied', 'rejected']
            })
            res.status(200).json({ status: 'SUCCESS', hits: data.length, data: data })
        }
        if (user.designation === 'principal') {
            const data = await Leave.find({
                HOD_approval: true,
                status: ['applied', 'rejected','approved']
            }).select('employee_id employee_name employee_dep from_date to_date leave_type discription')
            res.status(200).json({ status: 'SUCCESS', hits: data.length, data: data })
        }
    }
    else {
        return res.status(404).json({ msg: `no user with id ${userID}` })
    }
}


module.exports = { alluser, leaveStatus, getApprovals }