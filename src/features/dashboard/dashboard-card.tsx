type Props = {
  title: string;
  value: string | number;
  description?: string;
};


export function DashboardCard({
  title,
  value,
  description,
}: Props) {

  return (

    <div className="bg-white rounded-xl border p-5 shadow-sm">


      <p className="text-sm text-gray-500">
        {title}
      </p>


      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>


      {description && (

        <p className="text-sm text-gray-500 mt-2">
          {description}
        </p>

      )}


    </div>

  );

}