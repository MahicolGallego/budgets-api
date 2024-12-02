import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Request } from 'express';
import { IPayloadToken } from 'src/common/interfaces/payload-token.interface';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all categories of the user' }) // Describe el endpoint
  @ApiOkResponse({
    status: 200,
    description: 'List of categories retrieved successfully.',
    type: [Category],
  }) // Respuesta exitosa
  findAll(@Req() req: Request) {
    const user = req.user as IPayloadToken;
    return this.categoriesService.findAll(user.sub);
  }
}
