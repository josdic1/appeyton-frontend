import React from "react";

const Toast = ({ toast, onRemove }) => {
  const { id, status, title, description, who, how, when, where, actions } =
    toast;

  const statusColors = {
    success: "bg-green-50 border-green-500 text-green-800",
    error: "bg-red-50 border-red-500 text-red-800",
    warning: "bg-amber-50 border-amber-500 text-amber-800",
    info: "bg-blue-50 border-blue-500 text-blue-800",
  };

  return (
    <div
      className={`max-w-md w-full border-l-4 shadow-lg rounded-r-lg p-4 mb-4 transition-all duration-300 transform translate-x-0 ${statusColors[status] || statusColors.error}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-bold text-lg uppercase tracking-tight">
            {title}
          </h4>

          <div className="mt-2 text-sm space-y-1 opacity-90">
            <p>
              <span className="font-semibold italic">Why:</span> {description}
            </p>
            {who && (
              <p>
                <span className="font-semibold italic">Who:</span> {who}
              </p>
            )}
            {where && (
              <p>
                <span className="font-semibold italic">Where:</span> {where}
              </p>
            )}
            {how && (
              <p className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-current border-opacity-20 font-medium">
                <span className="font-bold uppercase text-xs block">
                  Action Required:
                </span>
                {how}
              </p>
            )}
          </div>

          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    console.log(`Trigger action: ${btn.action}`, btn.params)
                  }
                  className="px-3 py-1 bg-current text-white rounded text-xs font-bold hover:opacity-80 transition-opacity"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(id)}
          className="ml-4 text-xl font-bold leading-none hover:opacity-50"
        >
          &times;
        </button>
      </div>

      {when && (
        <div className="mt-2 text-[10px] uppercase opacity-50 text-right">
          {when}
        </div>
      )}
    </div>
  );
};

export default Toast;
