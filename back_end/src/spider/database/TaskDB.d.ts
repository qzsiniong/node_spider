export declare function insertTask(spiderName: any, task: any): Promise<any>;
export declare function updateTask(spiderName: any, task: any): Promise<any>;
export declare function loadTasksForRun(spiderName: any): Promise<any>;
export declare function listTasks(spiderName: any, limit: string, status: any, tags: any): Promise<{
    list: any;
    total: any;
}>;
export declare function getTask(spiderName: any, taskId: any, fields?: string[]): Promise<any>;
export declare function deleteTask(spiderName: any, taskId: any): Promise<boolean>;
export declare function countByStatus(spiderName: any): Promise<{}>;
declare const TaskDB: {
    insertTask: (spiderName: any, task: any) => Promise<any>;
    updateTask: (spiderName: any, task: any) => Promise<any>;
    loadTasksForRun: (spiderName: any) => Promise<any>;
    listTasks: (spiderName: any, limit: string, status: any, tags: any) => Promise<{
        list: any;
        total: any;
    }>;
    getTask: (spiderName: any, taskId: any, fields?: string[]) => Promise<any>;
    deleteTask: (spiderName: any, taskId: any) => Promise<boolean>;
    countByStatus: (spiderName: any) => Promise<{}>;
};
export default TaskDB;
