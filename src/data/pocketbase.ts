import PocketBase from "pocketbase";
import type {
  TypedPocketBase,
  ProjectsResponse,
  ProjectsRecord,
  TasksRecord,
  TasksResponse,
} from "./pocketbase-types";

type TexpandProject = {
  project?: ProjectsResponse;
};

export const pb: TypedPocketBase = new PocketBase(
  import.meta.env.POCKETBASE_URL || process.env.POCKETBASE_URL
);

pb.autoCancellation(false);

function getStatus(project: ProjectsResponse) {
  switch (project.status) {
    case "not started":
      return 7;
    case "on hold":
      return 6;
    case "started":
      return 5;
    case "in progress":
      return 4;
    case "almost finished":
      return 3;
    case "ongoing":
      return 2;
    case "done":
      return 1;
    default:
      return 0;
  }
}

export async function getProjects() {
  const projects = await pb.collection("projects").getFullList();

  return projects.sort((a, b) => getStatus(a) - getStatus(b));
}

export async function addProject(name: string) {
  const newProject = await pb.collection("projects").create({
    name,
    created_by: pb.authStore.model?.id,
    status: "not started",
  });
  return newProject;
}

export async function getProject(id: string) {
  const project = await pb.collection("projects").getOne(id);

  return project;
}

export async function addTask(project_id: string, text: string) {
  const newTask = await pb.collection("tasks").create({
    project: project_id,
    created_by: pb.authStore.model?.id,
    text,
  });

  return newTask;
}

export async function getTasks(
  project_id: string,
  done: boolean
): Promise<TasksResponse<TexpandProject>[]> {
  const options = {
    filter: "",
    expand: "project",
  };

  let filter = `completed = ${done}`;
  filter += `&& project = "${project_id}"`;
  options.filter = filter;

  let tasks: TasksResponse<TexpandProject>[];

  tasks = await pb.collection("tasks").getFullList(options);

  return tasks;
}

export async function deleteProject(id: string) {
  await pb.collection("projects").delete(id);
}

export async function updateProject(id: string, data: ProjectsRecord) {
  await pb.collection("projects").update(id, data);
}

export async function deleteTask(id: string) {
  await pb.collection("tasks").delete(id);
}

export async function updateTask(id: string, data: TasksRecord) {
  await pb.collection("tasks").update(id, data);
}

export async function getStarredTasks(): Promise<
  TasksResponse<TexpandProject>[]
> {
  const options = {
    sort: "-starred_on",
    filter: "starred = true && completed = false",
    expand: "project",
  };

  let tasks: TasksResponse<TexpandProject>[];
  tasks = await pb.collection("tasks").getFullList(options);

  return tasks;
}
