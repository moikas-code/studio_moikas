import React from "react";
import { Clock, CheckCircle, XCircle, Loader2, Download, Eye } from "lucide-react";
import Image from "next/image";
import type { ImageJob } from "../../hooks/use_job_based_image_generation";

interface JobHistoryPanelProps {
  jobs: ImageJob[];
  current_job: ImageJob | null;
  on_restore_job: (job_id: string) => void;
  on_refresh: () => void;
}

export function JobHistoryPanel({
  jobs,
  current_job,
  on_restore_job,
  on_refresh,
}: JobHistoryPanelProps) {
  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    return date.toLocaleString();
  };

  const get_status_icon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
      case "pending":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const get_status_color = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
      case "pending":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const download_image = (url: string, job_id: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `image-${job_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-base-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Jobs</h3>
        <button onClick={on_refresh} className="btn btn-sm btn-ghost" title="Refresh job history">
          <Loader2 className="w-4 h-4" />
        </button>
      </div>

      {current_job && (
        <div className="mb-4 p-4 bg-base-300 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {get_status_icon(current_job.status)}
              <span className={`font-semibold ${get_status_color(current_job.status)}`}>
                Current Job
              </span>
            </div>
            <span className="text-sm text-base-content/60">
              {format_date(current_job.created_at)}
            </span>
          </div>

          {current_job.status === "processing" && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{current_job.progress}%</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={current_job.progress}
                max="100"
              />
            </div>
          )}

          {current_job.status === "completed" && current_job.image_url && (
            <>
              <div className="mt-3 mb-3">
                <Image
                  src={
                    current_job.image_url.startsWith("data:")
                      ? current_job.image_url
                      : `data:image/png;base64,${current_job.image_url}`
                  }
                  alt="Generated"
                  width={256}
                  height={128}
                  className="w-full h-32 object-cover rounded"
                  unoptimized
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => download_image(current_job.image_url!, current_job.job_id)}
                  className="btn btn-sm btn-primary"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                {typeof current_job.metadata?.inference_time === "number" && (
                  <span className="text-xs text-base-content/60">
                    Generated in {current_job.metadata.inference_time.toFixed(1)}s
                  </span>
                )}
              </div>
            </>
          )}

          {current_job.status === "failed" && (
            <>
              {current_job.error && (
                <div className="mt-2 text-sm text-error">Error: {current_job.error}</div>
              )}
              <div className="mt-3">
                <button
                  onClick={() => on_restore_job(current_job.job_id)}
                  className="btn btn-sm btn-warning"
                >
                  <Loader2 className="w-4 h-4 mr-1" />
                  Retry
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {jobs.length === 0 ? (
          <p className="text-base-content/60 text-center py-4">No job history available</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.job_id}
              className="p-3 bg-base-300 rounded-lg hover:bg-base-300/80 transition-colors cursor-pointer"
              onClick={() => on_restore_job(job.job_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {get_status_icon(job.status)}
                  <span className={`text-sm ${get_status_color(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-base-content/60">{format_date(job.created_at)}</span>
              </div>

              {job.prompt && (
                <p className="text-sm text-base-content/80 mt-1 truncate">{job.prompt}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-base-content/60">
                  {job.cost} MP • {job.model}
                  {typeof job.metadata?.inference_time === "number" && (
                    <> • {job.metadata.inference_time.toFixed(1)}s</>
                  )}
                </span>
                {job.status === "completed" && <Eye className="w-4 h-4 text-base-content/60" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
