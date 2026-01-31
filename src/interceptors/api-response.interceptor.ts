import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, map, Observable, throwError } from "rxjs";

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const controllerName = context.getClass().name;
        const excludedControllers = ['AuthController', 'ProductsController'];

        if (excludedControllers.includes(controllerName)) {
            return next.handle();
        }

        return next.handle().pipe(
            map(data => this.transformSuccessResponse(data)),
            catchError(error => this.transformErrorResponse(error)),
        );
    }

    private transformSuccessResponse(data: any): any {
        // Si ya tiene formato ApiResponseDto, retornar tal cual
        if (data && typeof data === 'object' && 'ok' in data) {
            return data;
        }

        // Para respuestas vacías
        if (!data) {
            return {
                ok: true,
                mensaje: 'Operación exitosa',
                resultado: {},
            };
        }

        // Para respuestas con paginación
        if (data && data.paginacion) {
            return {
                ok: true,
                mensaje: 'Consulta exitosa',
                resultado: data.data || data,
                paginacion: data.paginacion,
            };
        }

        // Envolver en formato estándar
        return {
            ok: true,
            mensaje: 'Operación exitosa',
            resultado: data,
        };
    }

    private transformErrorResponse(error: any): Observable<never> {
        // Si ya es HttpException con formato ApiResponseDto
        if (error instanceof HttpException) {
            const errorResponse = error.getResponse();
            const status = error.getStatus();

            // Si ya tiene el formato correcto, dejarlo igual
            if (typeof errorResponse === 'object' && errorResponse !== null && 'ok' in errorResponse) {
                return throwError(() => error);
            }

            // Transformar al formato estándar
            const mensaje = this.extractErrorMessage(errorResponse, error);
            const resultado = this.extractErrorDetails(errorResponse);

            const formattedError = new HttpException(
                {
                    ok: false,
                    mensaje,
                    resultado,
                },
                status,
            );

            return throwError(() => formattedError);
        }

        // Para errores no controlados
        return throwError(() =>
            new HttpException(
                {
                    ok: false,
                    mensaje: error.message || 'Error interno del servidor',
                    resultado: {},
                },
                500,
            )
        );
    }

    private extractErrorMessage(errorResponse: any, error: HttpException): string {
        if (typeof errorResponse === 'string') {
            return errorResponse;
        }

        if (typeof errorResponse === 'object' && errorResponse !== null) {
            // Probar diferentes propiedades comunes
            return errorResponse.mensaje ||
                errorResponse.message ||
                errorResponse.error ||
                error.message;
        }

        return error.message;
    }

    private extractErrorDetails(errorResponse: any): any {
        if (typeof errorResponse === 'object' && errorResponse !== null) {
            // Eliminar propiedades que ya están en el mensaje
            const { mensaje, message, error, ...details } = errorResponse;
            return Object.keys(details).length > 0 ? details : {};
        }
        return {};
    }
}