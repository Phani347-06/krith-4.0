from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recommendation import router as recommendation_router
from routes.parent_feedback import router as parent_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API is running! Go to http://127.0.0.1:8000/docs to test the endpoints."}

app.include_router(recommendation_router)
app.include_router(parent_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
