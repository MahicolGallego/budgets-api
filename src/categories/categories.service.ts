import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly categoryRepository: Repository<Category>) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const categoryEntity = this.categoryRepository.create(createCategoryDto);
    const response = await this.categoryRepository.save(categoryEntity)
    return response;
  }

  async findAll(userId?: string) {
    const categoriesWithUserId = await this.categoryRepository.find({
      where: { user_id: userId},
    });
    
    const categoriesWithNullUserId = await this.categoryRepository.find({
      where: { user_id: null },
    });

    if (categoriesWithUserId ) {
      const combinedCategories = [...categoriesWithUserId, ...categoriesWithNullUserId];
      return combinedCategories;
    } else {
      return categoriesWithNullUserId
    }
    
  }

  async findByCategoryName(categoryName: string): Promise<Category> {
    return this.categoryRepository.findOne({ where: { name: categoryName } });
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
