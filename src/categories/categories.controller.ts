import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' }) // Describe el endpoint
  @ApiResponse({ status: 201, description: 'Category successfully created.', type: Category }) // Respuesta exitosa
  @ApiResponse({ status: 400, description: 'Invalid input.' }) // Error de validación
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all categories' }) // Describe el endpoint
  @ApiResponse({ status: 200, description: 'List of categories retrieved successfully.', type: [Category] }) // Respuesta exitosa
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve categories by name' }) // Describe el endpoint
  @ApiQuery({ name: 'category', description: 'Category name to filter by', required: false }) // Documenta el parámetro de query
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully.', type: [Category] }) // Respuesta exitosa
  findByCategoryName(@Query('category') categoryName: string) {
    return this.categoriesService.findAll(categoryName);
  }
}