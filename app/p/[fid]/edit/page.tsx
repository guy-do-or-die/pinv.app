import { MOCK_PINS } from "@/lib/mock-data";
import EditPinForm from "@/components/EditPinForm";

export default async function EditPin({ params }: { params: Promise<{ fid: string }> }) {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = MOCK_PINS[fid];

    return <EditPinForm fid={fid} pin={pin} />;
}
