<?php
namespace {{ namespace }};

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class {{ name }} extends Command
{
    /**
     * @inheritDoc
     */
    protected function configure()
    {
        $this->setName('my:command');
        $this->setDescription('This is my console command.');

        parent::configure();
    }

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     *
     * @return null|int
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $output->writeln('<info>Success Message.</info>');
        $output->writeln('<error>An error encountered.</error>');
    }
}