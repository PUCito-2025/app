type CardCourseProps = {
  name: string;
  courseCode: string;
  id: number;
  workFlowState: string;
  selected?: boolean;
};

export default function CardCourse({ name, courseCode, id, workFlowState, selected = false }: CardCourseProps) {
  return (
    <div
      className={[
        "cursor-pointer rounded border bg-white p-4 shadow transition-all hover:shadow-md",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "",
      ].join(" ")}
    >
      <h2 className="text-xl font-bold text-blue-600">{name}</h2>
      <p className="text-sm text-gray-600">Código: {courseCode}</p>
      <p className="text-xs text-gray-400">
        ID: {id} | Estado: {workFlowState}
      </p>
    </div>
  );
}
