const { CoachCertification } = require("../models");

module.exports.add_certification = async (req, res) => {
  //add certification, default pending
  try {
    const coach_id = req.user.user_id;
    const certification = await CoachCertification.create({
      coach_id,
      document_url: req.file.filename,
      status: "pending",
    });

    res.status(201).json({
      message: "Certification successfuly submitted for review",
      certification,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.verify_certification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await CoachCertification.update({ status }, { where: { id } });
    res.json({ message: `Certification is ${status}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.get_certification = async (req, res) => {
  try {
    const coach_id = req.user.user_id;
    const certs = await CoachCertification.findAll({
      where: { coach_id },
    });

    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
