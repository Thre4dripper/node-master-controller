import MasterController from '../MasterController';
import asyncHandler from '../AsyncHandler';
import { CronJob } from 'cron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

class CronConfig {
    /**
     * @description Method to initialize the cron jobs
     * @param dir - The directory to search for cron jobs
     * @param loadCrons - lambda function to load the cron jobs from the directory
     */
    static InitCronJobs = async (dir: string, loadCrons: (pathToCron: string) => void) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await CronConfig.InitCronJobs(fullPath, loadCrons);
            } else if (
                entry.isFile() &&
                (entry.name.endsWith('.cron.ts') || entry.name.endsWith('.cron.js'))
            ) {
                loadCrons(fullPath);
            }
        }
    };

    /**
     * @description Method to start the cron jobs for the registered crons
     */
    static startCronJobs = () => {
        MasterController.getCronRequests().forEach((client) => {
            asyncHandler(
                (async () => {
                    const cron = new CronJob(client.cronPattern, () => {
                        client.masterController.cronController();
                    });
                    cron.start();
                })()
            );
        });
    };
}

export default CronConfig;
