from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recommendation import router as recommendation_router
from routes.parent_feedback import router as parent_router
from routes.auth import router as auth_router
from routes.questions import router as questions_router
from routes.chat import router as chat_router
from routes.rl import router as rl_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
