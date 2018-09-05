## job queue

a "job" is a payload like this:

```json
{
  "name": "XXX",
  "params": {
    
  }
}
```

## dispatcher

the thing that is called by the backend to trigger a worker somewhere to handle
the job

the interface for dispatching a job is a function with this signature:

```javascript
function submitJob(job, done) {

}
```

the "done" callback means "the job has been submitted" - not that the job has
completed

## handler

the handler listens for new jobs and feeds them to the correct worker based on
the "name" property of the job

how it does this is up to the implementation - the idea is that we can switch
out the implemetation to something like redis later and still use the same
worker modules

because the handler will create workers and provide the store & dispatcher to
each of the workers (as well as the job itself) - the constructor for the 
handler is:

```javascript
function createHandler(store, dispatcher) {
  return function(job) {
    // pass the job params, store and dispatcher to a worker
  }
}
```

## workers

the interface for a worker is a function that accepts a job's params, the store and a dispatcher as so:

```javascript
function worker(params, store, dispatcher) {

}
```

a worker can read/write to the store and can dispatch other jobs

## simple-{dispatcher,handler}

This is a very basic implementation that uses event-emitters which assume
the dispatcher, handler and workers are all in the same process
