const { CoachCertification } = require("../models");

module.exports.add_certification = async (req, res) => {
  //add certification, default pending
  try {
    const coach_id = req.user.user_id;
    if (!req.file) {
      return res.status(400).json({ message: "Certification document is required" });
    }

    const certification = await CoachCertification.create({
      coach_id,
      document_url: `/uploads/${req.file.filename}`,
      status: "pending",
    });

    res.status(201).json({
      message: "Certification successfully submitted for review",
      certification,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.verify_certification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_comment } = req.body;
    const validStatuses = ["approved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    const cert = await CoachCertification.findOne({
      where: { certification_id: id },
    });
    if (!cert) {
      return res.status(404).json({ error: "Certification not found" });
    }

    if (cert.status !== "pending") {
      return res.status(400).json({
        error: "Certification has already been reviewed",
      });
    }

    await cert.update({
      status,
      admin_comment: admin_comment || null,
      reviewed_by: req.user.user_id,
      reviewed_at: new Date(),
    });
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
        console.log("GET certification error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports.delete_certification = async (req, res) => {
  try {
    const coach_id = req.user.user_id;
    const { id } = req.params;

    const deleted = await CoachCertification.destroy({
      where: {
        certification_id: id,
        coach_id,
      },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Certification not found." });
    }

    res.json({ message: "Certification deleted successfully!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
