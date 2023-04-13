const User = require("../models/users");
const jwt = require("jsonwebtoken")
const EmailVerificationtoken = require("../models/emailverificationtoken");
const { isValidObjectId } = require("mongoose");
const { generateOtp, generateMailtranspoter, generateRandomBytes } = require("../utils/mail");
const passwordresettoken = require("../models/passwordresettoken");



exports.create = async (req, res) => {
  try {
    const { name, email } = req.body

    const olduser = await User.findOne({ email })

    if (olduser) {
      res.send({ error: "email is all ready exsist!" })
    }

    const user = new User(req.body)

    await user.save()

    let otp = generateOtp()


    const newEmailVerificationtoken = new EmailVerificationtoken({
      owner: user._id,
      token: otp
    })



    await newEmailVerificationtoken.save()


    var transport = generateMailtranspoter()

    transport.sendMail({
      from: "verfication@otp.gmail.com",
      to: user.email,
      subject: "Email Verification",
      html: ` 
      <p>Your Verification OTP</p>
      <h1>${otp}</h1>`
    })
    res.status(201).send({ message: "otp has been sent to your email account!" })
  } catch (e) {
    console.log(e);
    res.send(e)
  }
}


exports.VerifyEmail = async (req, res) => {
  const { userId, otp } = req.body

  if (!isValidObjectId(userId)) {
    res.send({ error: "Invalid user!" })
  }

  const user = await User.findById(userId)

  if (!user) {
    res.send({ error: "user is not found!" })
  }

  if (user.isVerified) {
    res.send({ error: "user is all ready verified!" })
  }

  const token = await EmailVerificationtoken.findOne({ owner: userId })
  if (!token) {
    res.send({ error: "token not found!" })
  }

  const isMatched = await token.comparetoken(otp)

  if (!isMatched) {
    res.send({ error: "Please submit a valid OTP!" })
  }

  user.isVerified = true
  await user.save()

  await EmailVerificationtoken.findByIdAndDelete(token._id)

  var transport = generateMailtranspoter()

  transport.sendMail({
    from: "verfication@otp.gmail.com",
    to: user.email,
    subject: "Welcome Email",
    html: ` 
        <h1>Welcome our app ${user.name}, Thanks for chossing us! </h1>`
  })

  res.send({ message: "your email is verified!" })
}

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body

  const user = await User.findById(userId)

  if (!user) {
    res.send({ error: "user is not found!" })
  }

  if (user.isVerified) {
    res.send({ error: "user is all ready verified!" })
  }

  const allreadyHasToken = await EmailVerificationtoken.findOne({ owner: userId })

  if (allreadyHasToken) {
    res.send({ error: "Only after one hour you can send request for another token! " })
  }


  let otp = generateOtp()

  const newEmailVerificationtoken = new EmailVerificationtoken({
    owner: user._id,
    token: otp
  })



  await newEmailVerificationtoken.save()

  var transport = generateMailtranspoter()


  transport.sendMail({
    from: "verfication@otp.gmail.com",
    to: user.email,
    subject: "Email Verification",
    html: ` 
      <p>Your Verification OTP</p>
      <h1>${otp}</h1>`
  })

  res.send({ message: "new OTP has been sent to your register email account!" })

}


exports.forgetpassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      res.send({ error: "Email is missing!" })
    }

    const user = await User.findOne({ email })

    if (!user) {
      res.send({ error: "user not found!" })
    }

    const allreadyHasToken = await passwordresettoken.findOne({ owner: user._id })

    if (allreadyHasToken) {
      res.send({ error: "Only after one hour you can send request for another token! " })
    }

    const token = await generateRandomBytes()

    const newpasswordresettoken = new passwordresettoken({
      owner: user._id,
      token
    })

    await newpasswordresettoken.save()

    const resetpasswordurl = `http://localhost:3000/reset-password?token=${token}&id=${user._id}`

    var transport = generateMailtranspoter()


    transport.sendMail({
      from: "sequrity@app.gmail.com",
      to: user.email,
      subject: "Reset Password",
      html: ` 
      <p>Click here to reset your password</p>
      <a href="${resetpasswordurl}">Change Password</a>`
    })

    res.send({ message: "Link sent to your register email account!" })
  } catch (e) {
    console.log(e);
  }

}


exports.sendpasswordresettokenStatus = async (req, res) => {
  res.send({ valid: true })
}


exports.resetpassword = async (req, res) => {
  try {


    const { newpassword, userId } = req.body

    const user = await User.findById(userId)

    if (!user) {
      res.send({ error: "User not Found!" })
    }

    const matched = await user.comparepassword(newpassword)

    if (matched) {
      res.send({ error: "New password can not same with oldpassword, plz choose different password! " })
    }

    user.password = newpassword
    await user.save()

    await passwordresettoken.findByIdAndDelete(req.resettoken._id)
    console.log(req.resettoken._id);


    var transport = generateMailtranspoter()


    transport.sendMail({
      from: "sequrity@app.gmail.com",
      to: user.email,
      subject: "Password Reset Successfully",
      html: ` 
      <h1> ${user.name} your Password Reset Successfully"</h1>
      <p>Now you can use new Password</p>`
    })

    res.send({ message: "your Password Reset Successfully!" })
  } catch (e) {
    console.log(e);
  }
}


exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    console.log(user);
    if (!user) {
      res.send({ error: "Email/password is invalid!" })
    }

    const matched = await user.comparepassword(password)


    if (!matched) {
      res.send({ error: "Email/password is invalid!" })
    }

    const jwttoken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)

    res.send({ user: { id: user._id, name: user.name, email, token: jwttoken } })
  } catch (e) {
    console.log(e);
  }
}
