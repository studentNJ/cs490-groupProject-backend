const { CoachQualification } = require("../models");

module.exports.add_qualification = async (req, res) => { //add qualifications
    try {
        const user_id = req.user.user_id;
        const {degree_name, institution, field_of_study, year_completed} = req.body;
        if (!degree_name || !institution || !field_of_study || !year_completed){
            return res.status(404).json({ message: "All information must be submitted" });
        }
        const qualification = await CoachQualification.create({
            user_id,
            degree_name,
            institution,
            field_of_study,
            year_completed,
        });
        res.status(201).json({
            message: "Qualification added successfully!",
            qualification,
        });
    } catch (err){
        return res.status(500).json({ error: err.message });
    }
};

module.exports.get_qualification = async (req, res) => { //get qualifications
    try {
        const user_id = req.user.user_id;
        const qualifications = await CoachQualification.findAll({
            where: {user_id},
        });
        res.json(qualifications);
    } catch (err){
        return res.status(500).json({ error: err.message });
    }
};

module.exports.delete_qualification = async (req, res ) => {
    try {
        const user_id = req.user.user_id;
        const {id} = req.params;
        await CoachQualification.destroy({
            where: {qualification_id: id, user_id},
        });
        res.json({message: "Qualification deleted successfully!"});
    } catch(err){
        return res.status(500).json({ error: err.message });
    }
};