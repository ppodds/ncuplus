import { store, ToastType } from "@/plugins/store";
import { FetchResponse } from "ohmyfetch";
import { APIComment } from "~~/types/APIComment";
import { APIPastExam } from "~~/types/APIPastExam";
import { APIReaction } from "~~/types/APIReaction";
import { APIResponse } from "~~/types/APIResponse";
import { APIReview } from "~~/types/APIReview";

type CourseFeedbackType = "comment" | "review";

export async function createReaction(
  target: CourseFeedbackType,
  operation: "like" | "dislike",
  targetId: number
): Promise<APIReaction | null> {
  const config = useRuntimeConfig();
  const response = <APIResponse<APIReaction>>(
    await $fetch(
      `${config.public.apiBaseUrl}/${target}s/${targetId}/reactions`,
      {
        method: "POST",
        body: {
          operation,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
  );
  if (!response.data) {
    let message;
    if (response.statusCode === 401) message = "尚未登入";
    else if (response.statusCode === 403) {
      if (
        (response.message as string).startsWith(
          "You cannot like or dislike your own"
        )
      )
        message = "你不能推噓自己的內容!";
      else if (
        (response.message as string).startsWith(
          "You have already liked or disliked"
        )
      )
        message = "你已經為這篇內容推噓過了!";
    }
    await store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return null;
  }
  await store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "操作成功",
  });
  return response.data;
}

export async function createComment(
  classNo: string,
  content: string
): Promise<APIComment | null> {
  return createCommentOrReview("comment", classNo, content);
}

export async function createReview(
  classNo: string,
  content: string
): Promise<APIComment | null> {
  return createCommentOrReview("review", classNo, content);
}

async function createCommentOrReview(
  target: CourseFeedbackType,
  classNo: string,
  content: string
): Promise<APIComment | APIReview | null> {
  const config = useRuntimeConfig();
  const response = <APIResponse<APIReview | APIComment>>(
    await $fetch(
      `${config.public.apiBaseUrl}/course-feedback/${classNo}/${target}s`,
      {
        method: "POST",
        body: { content: content },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
  );

  if (!response.data) {
    let message = "未知錯誤";
    if (response.statusCode === 401) message = "尚未登入";
    await store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return null;
  }

  await store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "操作成功",
  });
  return response.data;
}

export async function editComment(
  id: number,
  content: string
): Promise<APIComment | null> {
  return editCommentOrReview("comment", id, content);
}

export async function editReview(
  id: number,
  content: string
): Promise<APIReview | null> {
  return editCommentOrReview("review", id, content);
}

async function editCommentOrReview(
  target: CourseFeedbackType,
  targetId: number,
  newContent: string
): Promise<APIComment | APIReview | null> {
  const config = useRuntimeConfig();
  const response = <APIResponse<APIReview | APIComment>>(
    await $fetch(`${config.public.apiBaseUrl}/${target}s/${targetId}`, {
      method: "PUT",
      body: { content: newContent },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
  );
  if (!response.data) {
    let message = "未知錯誤";
    if (response.statusCode === 401) message = "尚未登入";
    else if (response.statusCode === 403) message = "無此權限";

    await store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return null;
  }
  await store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "操作成功",
  });
  return response.data;
}

async function deleteCommentOrReview(
  target: CourseFeedbackType,
  targetId: number
): Promise<boolean> {
  const config = useRuntimeConfig();
  const response = <APIResponse<any>>(
    await $fetch(`${config.public.apiBaseUrl}/${target}s/${targetId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
  );
  if (response.statusCode !== 200) {
    let message = "未知錯誤";
    if (response.statusCode === 401) message = "尚未登入";
    else if (response.statusCode === 403) message = "無此權限";
    else if (response.statusCode === 404) message = "找不到該資料";

    await store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return false;
  }

  await store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "操作成功",
  });
  return true;
}

export async function deleteComment(id: number): Promise<boolean> {
  return deleteCommentOrReview("comment", id);
}

export async function deleteReview(id: number): Promise<boolean> {
  return deleteCommentOrReview("review", id);
}

export async function createPastExam(
  classNo: string,
  uploadData: {
    year: string;
    description: string;
    file: File;
  }
): Promise<APIPastExam | null> {
  const config = useRuntimeConfig();
  const formdata = new FormData();
  formdata.append("classNo", classNo);
  formdata.append("file", uploadData.file);
  formdata.append("year", uploadData.year);
  formdata.append("description", uploadData.description);
  const response = <APIResponse<APIPastExam>>(
    await $fetch(
      `${config.public.apiBaseUrl}/course-feedback/${classNo}/past-exams`,
      {
        method: "POST",
        body: formdata,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
  );

  if (!response.data) {
    let message = "上傳時發生錯誤";
    if (response.statusCode === 401) message = "尚未登入";
    else if (response.statusCode === 400) message = "檔案不合法";
    store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return null;
  }
  store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "上傳成功",
  });
  return response.data;
}

export async function downloadPastExam(id: number): Promise<boolean> {
  const config = useRuntimeConfig();

  const response = <FetchResponse<any>>await $fetch.raw(
    `${config.public.apiBaseUrl}/past-exam/${id}`,
    {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  if (!response.blob()) {
    let message = "下載時發生錯誤";
    if (response.status === 401) message = "尚未登入";
    store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return false;
  }

  // save file to local
  const url = window.URL.createObjectURL(new Blob([await response.blob()]));
  const link = document.createElement("a");
  link.href = url;
  const savedFilename = response.headers
    .get("content-disposition")!
    .substring(response.headers.get("content-disposition")!.indexOf("=") + 1);
  link.download = savedFilename ? savedFilename : "pastexam";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export async function deletePastExam(id: number) {
  const config = useRuntimeConfig();
  const response = <APIResponse<any>>(
    await $fetch(`${config.public.apiBaseUrl}/past-exam/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
  );

  if (response.statusCode !== 200) {
    let message = "刪除時發生錯誤";
    if (response.statusCode === 401) message = "尚未登入";
    else if (response.statusCode === 403) message = "無此權限";

    store.dispatch("pushToast", {
      type: ToastType.ERROR,
      message: message,
    });
    return false;
  }

  store.dispatch("pushToast", {
    type: ToastType.SUCCESS,
    message: "刪除成功",
  });
  return true;
}