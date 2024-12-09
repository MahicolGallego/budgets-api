import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const categoryEntity = this.categoryRepository.create(createCategoryDto);
      const response = await this.categoryRepository.save(categoryEntity);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findAll(userId: string): Promise<Category[]> {
    try {
      console.log(userId);
      return await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.user_id = :userId OR category.user_id IS NULL', {
          userId,
        })
        .getMany();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findByCategoryName(
    userId: string,
    categoryName: string,
  ): Promise<Category> {
    try {
      return await this.categoryRepository
        .createQueryBuilder('category')
        .where(
          '(category.user_id = :userId OR category.user_id IS NULL) AND category.name = :categoryName',
          {
            userId,
            categoryName,
          },
        )
        .getOne();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} category`;
  // }

  // update(id: number, updateCategoryDto: UpdateCategoryDto) {
  //   return `This action updates a #${id} category`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} category`;
  // }
}
