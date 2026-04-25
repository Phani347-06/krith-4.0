from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recommendation import router as recommendation_router
from routes.parent_feedback import router as parent_router
from routes.auth import router as auth_router
from routes.questions import router as questions_router
from routes.chat import router as chat_router
from routes.rl import router as rl_router

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
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(questions_router, prefix="/api/questions", tags=["questions"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(rl_router, prefix="/api/rl", tags=["rl"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
