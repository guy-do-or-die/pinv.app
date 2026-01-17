try {
    const CID = require('cids');
    console.log("CIDS package found");
    const v1 = "bafkreicdwsmluji4q4xetlrwpg4oxaue3of46o6fg4uedw2vzay7xyppbq";
    try {
        const c = new CID(v1);
        console.log("Converted:", c.toV0().toString());
    } catch (e) {
        console.log("Conversion failed (might be raw leaf?):", e.message);
    }
} catch (e) {
    console.log("CIDS package NOT found");
}
