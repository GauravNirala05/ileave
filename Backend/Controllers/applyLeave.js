//dependencies
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes')
//models
const User = require('../model/User')
const Leave = require('../model/Leave')
//Errors
const { NotFound, BadRequestError, UnAuthorizedError } = require('../errors');


const applyLeave = async (req, res) => {
    const { userID, userName } = req.user
    const availableleave = await Leave.find({ employee_id: userID, status: ['applied', 'approved', 'completed'] }).sort('to_date')
    const fromDate = new Date(req.body.from_date)
    const toDate = new Date(req.body.to_date)
    if(fromDate>toDate){
        throw new BadRequestError(`toDate must be greater or equal to the fromDate..`)
    }
    if (availableleave.length > 0) {
        lastLeaveApplied = availableleave[availableleave.length - 1]
        if (lastLeaveApplied.to_date >= fromDate) {
            throw new BadRequestError(`Can't apply another leave of confilicting dates until the applied ones is Done..`)
        }
    }
    const user = await User.findOne({ _id: userID })
    const leave_type = req.body.leave_type
    const total_days = req.body.total_days

    if (leave_type === 'casual_leave') {
        if (user.leave_type.casual_leave < total_days) {
            throw new BadRequestError(`Your remaining Casual Leave is lower than applied`)
        }
    }
    if (leave_type === 'earned_leave') {
        if (user.leave_type.earned_leave < total_days) {
            throw new BadRequestError(`Your remaining Earned Leave is lower than applied`)
        }
    }
    if (leave_type === 'ordinary_leave') {
        if (user.leave_type.ordinary_leave < total_days) {
            throw new BadRequestError(`Your remaining Ordinary Leave is lower than applied`)
        }
    }
    if (leave_type === 'medical_leave') {
        if (user.leave_type.medical_leave < total_days) {
            throw new BadRequestError(`Your remaining Medical Leave is lower than applied`)
        }
    }
    if (user) {
        const userDep = user.department
        const designation = user.designation
        req.body.employee_id = userID
        req.body.employee_dep = userDep
        req.body.employee_name = userName

        if (designation === 'faculty') {
            const leave = await Leave.create(req.body)
            return res.status(StatusCodes.CREATED).json({ leave: leave, status: 'SUCCESS' })
        }
        if (designation === 'HOD') {
            const leave = await Leave.create(req.body)
            leave.HOD_approval = true
            await leave.save()
            return res.status(StatusCodes.CREATED).json({ leave: leave, status: 'SUCCESS' })

        }
        if (designation === 'principal') {
            return res.send('you are principal')
        }

        throw new NotFound(`the credential ${user.designation} doesnt exists...`)

    } else {
        throw new NotFound(`Provide the valid credentials while authorization...`)
    }
}
const getReferenceName = async (req, res) => {
    const { userID, userName } = req.user
    const user = await User.findOne({ _id: userID })
    if (user) {
        const designation = user.designation
        if (designation === 'faculty') {
            const getuser = await User.find({ department: user.department, designation: 'faculty' }).select('name')
            return res.status(StatusCodes.OK).json({ status: `SUCCESS`, hits: getuser.length, data: getuser })
        }
        if (designation === 'HOD') {
            const getuser = await User.find({ department: user.department}).select('name')
            return res.status(StatusCodes.OK).json({ status: `SUCCESS`, hits: getuser.length, data: getuser })
        }
        if (designation === 'principal') {
            const getuser = await User.find({ designation: ['faculty', 'HOD'] }).select('name')
            return res.status(StatusCodes.OK).json({ status: `SUCCESS`, hits: getuser.length, data: getuser })
        }

    } else {
        throw new UnAuthorizedError(`user with id ${userID} doesnt exists...`)
    }
}
module.exports = {applyLeave,getReferenceName}