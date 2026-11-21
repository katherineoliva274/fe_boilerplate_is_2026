"use client";
import { useParams } from "next/navigation";
import ProgressForm from "../../_components/ProgressForm";
export default function EditarProgresoPage() {
    const params = useParams<{ id: string }>();
    return <ProgressForm registroId={params.id} />;
}
