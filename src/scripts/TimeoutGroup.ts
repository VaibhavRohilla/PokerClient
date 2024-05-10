

export class TimeoutGroup
{
    private timeoutIds : NodeJS.Timeout[] = [];

    addTimeout(timeout : number, callback : () => void)
    {
        const timeoutId = setTimeout(() => {
            callback();
            this.timeoutIds.splice(this.timeoutIds.indexOf(timeoutId), 1);
        }, timeout);

        this.timeoutIds.push(timeoutId);
    }

    clearAll()
    {
        this.timeoutIds.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });

        this.timeoutIds = [];
    }
}