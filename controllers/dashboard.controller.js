const menuModel = require("../models/menu.model");
const teacherModel = require("../models/teacher.model");




const getMenus = async (req, res) => {
    try {
        const { role } = req.params;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required to fetch menus",
            });
        }

        const menus = await menuModel
            .find(
                { menuAccessRoles: role },      // filter
                { menuAccessRoles: 0 }          // exclude from response
            )
            .sort({ menuOrder: 1 });

        return res.status(200).json({
            success: true,
            message: "Menus fetched successfully",
            data: menus,
            count: menus.length,
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch menus",
            error: error.message,
        });
    }
};


module.exports = {     
    getMenus,
}