# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from api.api_v1.api import api_router
# from appsettings import appsettings
#
# app = FastAPI(title="Fastapi Demo", openapi_url=f"{appsettings.API_BASE_URL}/openapi.json")
#
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=appsettings.ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# app.include_router(api_router, prefix=appsettings.API_BASE_URL)
#
# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host=appsettings.HOST, port=appsettings.PORT, reload=True)