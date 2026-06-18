package com.ser.ps.infrastructure.config;

import com.ser.ps.application.ports.in.AiSuggestionService;
import com.ser.ps.application.ports.in.KanbanService;
import com.ser.ps.application.ports.out.AiKanbanProvider;
import com.ser.ps.application.ports.out.BoardRepositoryPort;
import com.ser.ps.application.ports.out.KanbanListRepositoryPort;
import com.ser.ps.application.ports.out.LabelRepositoryPort;
import com.ser.ps.application.ports.out.TaskRepositoryPort;
import com.ser.ps.application.ports.out.UserRepositoryPort;
import com.ser.ps.domain.service.AiSuggestionServiceImpl;
import com.ser.ps.domain.service.KanbanServiceImpl;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KanbanUseCaseConfig {

    @Bean
    public KanbanService kanbanService(
            BoardRepositoryPort boardRepositoryPort,
            KanbanListRepositoryPort listRepositoryPort,
            TaskRepositoryPort taskRepositoryPort,
            LabelRepositoryPort labelRepositoryPort,
            UserRepositoryPort userRepositoryPort
    ) {
        return new KanbanServiceImpl(
                boardRepositoryPort,
                listRepositoryPort,
                taskRepositoryPort,
                labelRepositoryPort,
                userRepositoryPort
        );
    }

    @Bean
    public AiSuggestionService aiSuggestionService(List<AiKanbanProvider> aiKanbanProviders) {
        return new AiSuggestionServiceImpl(aiKanbanProviders);
    }
}
